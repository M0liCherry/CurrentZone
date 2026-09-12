#include "sct013.h"
#include <math.h>
#include <string.h>
#include "esp_log.h"
#include "esp_timer.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_adc/adc_cali_scheme.h"

static const char *TAG = "SCT013_DRIVER";

static sct013_config_t s_config;
static adc_oneshot_unit_handle_t s_adc_handle = NULL;
static adc_cali_handle_t s_cali_handle = NULL;
static bool s_is_calibrated = false;

// Persistent accumulated energy tracking
static double s_accumulated_energy_kwh = 0.0;
static int64_t s_last_read_timestamp_us = 0;

sct013_config_t sct013_get_default_config(void)
{
    sct013_config_t cfg = {
        .adc_unit = ADC_UNIT_1,
        .adc_channel = ADC_CHANNEL_6,      // GPIO 34 on ESP32
        .adc_atten = ADC_ATTEN_DB_12,       // Full 0 - 3.3V range
        .burden_ohms = 22.0f,               // 22 Ohm burden resistor
        .turns_ratio = 2000,                // 100A / 50mA secondary
        .nominal_voltage = 230.0f,          // 230V AC RMS grid
        .power_factor = 0.92f,              // Typical domestic/feeder PF
        .sample_cycles = 10,                // 10 cycles of 50Hz = 200ms
        .samples_per_cycle = 50             // 500 samples total
    };
    return cfg;
}

static bool init_adc_calibration(adc_unit_t unit, adc_channel_t channel, adc_atten_t atten, adc_cali_handle_t *out_handle)
{
    adc_cali_handle_t handle = NULL;
    esp_err_t ret = ESP_FAIL;
    bool calibrated = false;

#if ADC_CALI_SCHEME_CURVE_FITTING_SUPPORTED
    if (!calibrated) {
        adc_cali_curve_fitting_config_t cali_config = {
            .unit_id = unit,
            .chan = channel,
            .atten = atten,
            .bitwidth = ADC_BITWIDTH_DEFAULT,
        };
        ret = adc_cali_create_scheme_curve_fitting(&cali_config, &handle);
        if (ret == ESP_OK) {
            calibrated = true;
            ESP_LOGI(TAG, "ADC Calibration Scheme: Curve Fitting active");
        }
    }
#endif

#if ADC_CALI_SCHEME_LINE_FITTING_SUPPORTED
    if (!calibrated) {
        adc_cali_line_fitting_config_t cali_config = {
            .unit_id = unit,
            .atten = atten,
            .bitwidth = ADC_BITWIDTH_DEFAULT,
        };
        ret = adc_cali_create_scheme_line_fitting(&cali_config, &handle);
        if (ret == ESP_OK) {
            calibrated = true;
            ESP_LOGI(TAG, "ADC Calibration Scheme: Line Fitting active");
        }
    }
#endif

    *out_handle = handle;
    return calibrated;
}

esp_err_t sct013_init(const sct013_config_t *config)
{
    if (config) {
        s_config = *config;
    } else {
        s_config = sct013_get_default_config();
    }

    // 1. Initialize ADC Unit
    adc_oneshot_unit_init_cfg_t init_cfg = {
        .unit_id = s_config.adc_unit,
        .ulp_mode = ADC_ULP_MODE_DISABLE,
    };
    esp_err_t err = adc_oneshot_new_unit(&init_cfg, &s_adc_handle);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to create ADC unit: %s", esp_err_to_name(err));
        return err;
    }

    // 2. Configure Channel Attenuation & Bitwidth
    adc_oneshot_chan_cfg_t chan_cfg = {
        .atten = s_config.adc_atten,
        .bitwidth = ADC_BITWIDTH_DEFAULT,
    };
    err = adc_oneshot_config_channel(s_adc_handle, s_config.adc_channel, &chan_cfg);
    if (err != ESP_OK) {
        ESP_LOGE(TAG, "Failed to configure ADC channel: %s", esp_err_to_name(err));
        return err;
    }

    // 3. Initialize Factory eFuse Calibration
    s_is_calibrated = init_adc_calibration(
        s_config.adc_unit,
        s_config.adc_channel,
        s_config.adc_atten,
        &s_cali_handle
    );

    s_last_read_timestamp_us = esp_timer_get_time();
    ESP_LOGI(TAG, "Robocraze SCT-013 100A Driver initialized (Rb=%.1f Ohm, Turns=%d, Cali=%d)",
             s_config.burden_ohms, s_config.turns_ratio, s_is_calibrated);
    return ESP_OK;
}

esp_err_t sct013_read_metrics(sct013_metrics_t *metrics)
{
    if (!metrics || !s_adc_handle) {
        return ESP_ERR_INVALID_ARG;
    }

    uint32_t total_samples = s_config.sample_cycles * s_config.samples_per_cycle;
    if (total_samples < 50) total_samples = 500;

    int raw_val = 0;
    int voltage_mv = 0;
    int64_t sum_voltage_mv = 0;

    // Buffer to hold momentary voltages (mV) for 2-pass DC bias removal & RMS integration
    // Stack allocation for 500 samples * 2 bytes = 1 KB
    static int16_t sample_voltages[600];
    if (total_samples > 600) total_samples = 600;

    // Pass 1: Acquire samples across synchronized grid cycles (e.g. ~200ms)
    for (uint32_t i = 0; i < total_samples; i++) {
        esp_err_t err = adc_oneshot_read(s_adc_handle, s_config.adc_channel, &raw_val);
        if (err == ESP_OK) {
            if (s_is_calibrated && s_cali_handle) {
                adc_cali_raw_to_voltage(s_cali_handle, raw_val, &voltage_mv);
            } else {
                // Fallback uncalibrated conversion: 3300mV / 4095
                voltage_mv = (raw_val * 3300) / 4095;
            }
        } else {
            voltage_mv = 1650; // Fallback to midpoint bias
        }

        sample_voltages[i] = (int16_t)voltage_mv;
        sum_voltage_mv += voltage_mv;

        // Sample delay: 200ms / 500 = 400 microseconds
        esp_rom_delay_us(380);
    }

    // Pass 2: Determine actual DC bias (average of entire full AC wave)
    float bias_mv = (float)sum_voltage_mv / (float)total_samples;

    // Pass 3: Calculate RMS secondary and primary current
    double sum_i_squared = 0.0;
    float peak_primary_amps = 0.0f;
    float ct_scaling = (float)s_config.turns_ratio / s_config.burden_ohms; // (2000 / 22.0) = 90.909

    for (uint32_t i = 0; i < total_samples; i++) {
        // Instantaneous voltage across burden resistor in Volts:
        float v_burden = ((float)sample_voltages[i] - bias_mv) / 1000.0f;

        // Primary AC current: i_prim = (v_burden / R_burden) * turns_ratio
        float i_primary = v_burden * ct_scaling;

        sum_i_squared += (double)(i_primary * i_primary);

        float abs_i = fabsf(i_primary);
        if (abs_i > peak_primary_amps) {
            peak_primary_amps = abs_i;
        }
    }

    float current_rms = (float)sqrt(sum_i_squared / (double)total_samples);

    // Filter out residual ADC quantization noise floor (< 0.15 A)
    if (current_rms < 0.15f) {
        current_rms = 0.0f;
        peak_primary_amps = 0.0f;
    }

    // Apparent Power S = V_rms * I_rms
    float apparent_power_va = s_config.nominal_voltage * current_rms;
    // Active Power P = S * Power_Factor
    float active_power_w = apparent_power_va * s_config.power_factor;

    // Cumulative Energy Integration: Delta t in hours
    int64_t now_us = esp_timer_get_time();
    double dt_hours = (double)(now_us - s_last_read_timestamp_us) / (3600.0 * 1000000.0);
    s_last_read_timestamp_us = now_us;

    if (dt_hours > 0.0 && dt_hours < 1.0) {
        s_accumulated_energy_kwh += (double)(active_power_w / 1000.0f) * dt_hours;
    }

    metrics->current_rms = current_rms;
    metrics->current_peak = peak_primary_amps;
    metrics->apparent_power_va = apparent_power_va;
    metrics->active_power_w = active_power_w;
    metrics->energy_kwh_accumulated = (float)s_accumulated_energy_kwh;
    metrics->samples_taken = total_samples;
    metrics->bias_voltage_mv = bias_mv;

    return ESP_OK;
}
