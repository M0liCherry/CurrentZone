#pragma once

#include <stdbool.h>
#include <stdint.h>
#include "esp_err.h"
#include "esp_adc/adc_oneshot.h"
#include "esp_adc/adc_cali.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Configuration parameters for Robocraze SCT-013 100A AC Current Sensor.
 *
 * Circuit Interface:
 * - SCT-013-000 Non-invasive Split Core Transformer (100A / 50mA secondary, 2000 turns)
 * - Burden resistor Rb (typically 18 - 33 Ohms, default 22 Ohms)
 * - 10k/10k DC voltage divider from 3.3V to create ~1.65V DC midpoint bias
 * - 10uF decoupling capacitor between 1.65V bias node and GND
 * - Output connects to ESP32 ADC1 (Default: GPIO 34 / ADC_CHANNEL_6)
 */
typedef struct {
    adc_unit_t adc_unit;            /*!< ADC Unit (default: ADC_UNIT_1) */
    adc_channel_t adc_channel;      /*!< ADC Channel (default: ADC_CHANNEL_6 for GPIO 34) */
    adc_atten_t adc_atten;          /*!< ADC Attenuation (default: ADC_ATTEN_DB_12) */
    float burden_ohms;              /*!< Burden resistor value in Ohms (default: 22.0) */
    int turns_ratio;                /*!< CT Turns ratio (default: 2000 for 100A:50mA) */
    float nominal_voltage;          /*!< AC Grid RMS voltage in Volts (e.g. 230.0V) */
    float power_factor;             /*!< Assumed or measured load power factor (e.g. 0.92) */
    uint32_t sample_cycles;         /*!< Number of AC 50Hz cycles to sample per measurement (default: 10 cycles = 200ms) */
    uint32_t samples_per_cycle;     /*!< Target samples per 20ms cycle (default: 50 -> 500 samples total) */
} sct013_config_t;

/**
 * @brief Telemetry metrics calculated from SCT-013 samples.
 */
typedef struct {
    float current_rms;              /*!< True RMS AC current in Amperes */
    float current_peak;             /*!< Instantaneous surge peak current in Amperes */
    float apparent_power_va;        /*!< Apparent power in Volt-Amperes (S = V_rms * I_rms) */
    float active_power_w;           /*!< Estimated active power in Watts (P = S * PF) */
    float energy_kwh_accumulated;   /*!< Cumulative energy consumption in kWh */
    float voltage_v;                /*!< Grid RMS voltage in Volts (e.g. 230.0V) */
    float frequency_hz;             /*!< Grid frequency in Hz (e.g. 50.0Hz) */
    uint32_t samples_taken;         /*!< Number of ADC conversions in this window */
    float bias_voltage_mv;          /*!< Measured/calibrated DC midpoint bias voltage in mV */
} sct013_metrics_t;

/**
 * @brief Initialize the SCT-013 sensor ADC driver and calibration unit.
 *
 * @param config Pointer to sct013_config_t configuration. If NULL, default parameters are used.
 * @return esp_err_t ESP_OK on success, or error code.
 */
esp_err_t sct013_init(const sct013_config_t *config);

/**
 * @brief Samples the AC current waveform across multiple full grid cycles and calculates RMS metrics.
 *
 * @param[out] metrics Pointer to sct013_metrics_t structure to receive computed metrics.
 * @return esp_err_t ESP_OK on success.
 */
esp_err_t sct013_read_metrics(sct013_metrics_t *metrics);

/**
 * @brief Returns the default configuration for Robocraze SCT-013 100A on ESP32.
 */
sct013_config_t sct013_get_default_config(void);

#ifdef __cplusplus
}
#endif
