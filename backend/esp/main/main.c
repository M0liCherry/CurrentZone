#include <stdio.h>
#include <string.h>
#include "esp_log.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"

#include "sct013.h"
#include "dummy_load.h"
#include "wifi_station.h"
#include "telemetry_client.h"

static const char *TAG = "SMARTWATT_MAIN";

#ifndef WIFI_SSID
#define WIFI_SSID           "Pegasis C2"
#endif
#ifndef WIFI_PASSWORD
#define WIFI_PASSWORD       "Hydroarchon"
#endif
#ifndef BACKEND_POST_URL
#define BACKEND_POST_URL    "http://10.33.52.143:8000/api/telemetry/ingest"
#endif
#ifndef DEVICE_ID
#define DEVICE_ID           "esp32_sct013_res_01"
#endif
#ifndef TRANSFORMER_ID
#define TRANSFORMER_ID      "TX-RES-01"
#endif

// Set to 1 to transmit varying dummy current readings without SCT-013
// hardware (bench testing / frontend "Connect Device" demo). Set to 0
// for real ADC measurements on device.
#ifndef SMARTWATT_DUMMY_MODE
#define SMARTWATT_DUMMY_MODE 0
#endif

static void sct013_monitor_task(void *pvParameters)
{
#if SMARTWATT_DUMMY_MODE
    ESP_LOGI(TAG, "DUMMY MODE enabled — sending varying simulated current (no ADC hardware).");
#else
    ESP_LOGI(TAG, "Starting SCT-013 Continuous Monitoring Task...");
#endif
    sct013_metrics_t metrics;

    while (1) {
        esp_err_t err;
#if SMARTWATT_DUMMY_MODE
        err = dummy_load_next(&metrics, 230.0f, 0.92f);
#else
        err = sct013_read_metrics(&metrics);
#endif
        if (err == ESP_OK) {
            ESP_LOGI(TAG, "== SCT-013 Live Reading ==");
            ESP_LOGI(TAG, "  Current RMS  : %.2f A (Peak: %.2f A)", metrics.current_rms, metrics.current_peak);
            ESP_LOGI(TAG, "  Active Power : %.2f kW (Apparent: %.2f kVA)", 
                     metrics.active_power_w / 1000.0f, metrics.apparent_power_va / 1000.0f);
            ESP_LOGI(TAG, "  Cumulative E : %.4f kWh", metrics.energy_kwh_accumulated);
            ESP_LOGI(TAG, "  DC Mid Bias  : %.1f mV (Samples: %lu)", metrics.bias_voltage_mv, (unsigned long)metrics.samples_taken);

            // Warning if approaching 100A sensor / branch limits
            if (metrics.current_rms > 90.0f) {
                ESP_LOGW(TAG, "⚠️ HIGH LOAD WARNING: Feeder current %.2f A approaching rated limit!", metrics.current_rms);
            }

            // Transmit to SmartWatt Outage Predictor backend if Wi-Fi connected
            if (wifi_station_is_connected()) {
                telemetry_client_post_metrics(&metrics);
            } else {
                ESP_LOGD(TAG, "Wi-Fi not connected yet, skipping HTTP POST");
            }
        } else {
            ESP_LOGE(TAG, "Failed to read SCT-013 metrics: %s", esp_err_to_name(err));
        }

        // Sampling interval (every 3 seconds)
        vTaskDelay(pdMS_TO_TICKS(3000));
    }
}

void app_main(void)
{
    ESP_LOGI(TAG, "================================================");
    ESP_LOGI(TAG, "  SmartWatt Electricity Outage Predictor        ");
    ESP_LOGI(TAG, "  ESP32 Firmware with Robocraze SCT-013 100A CT ");
    ESP_LOGI(TAG, "================================================");

    // 1. Initialize NVS (required for Wi-Fi storage)
    esp_err_t ret = nvs_flash_init();
    if (ret == ESP_ERR_NVS_NO_FREE_PAGES || ret == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        ESP_ERROR_CHECK(nvs_flash_erase());
        ret = nvs_flash_init();
    }
    ESP_ERROR_CHECK(ret);

    // 2. Initialize Robocraze SCT-013 100A Sensor Driver (skipped in dummy mode)
#if SMARTWATT_DUMMY_MODE
    dummy_load_reset();
    sct013_config_t sct_cfg = sct013_get_default_config();
    ESP_LOGI(TAG, "Dummy mode: SCT-013 ADC init skipped.");
#else
    sct013_config_t sct_cfg = sct013_get_default_config();
    sct_cfg.burden_ohms = 22.0f;       // 22 Ohm burden resistor
    sct_cfg.turns_ratio = 2000;        // 100A : 50mA
    sct_cfg.nominal_voltage = 230.0f;  // 230V AC
    sct_cfg.power_factor = 0.92f;
    ESP_ERROR_CHECK(sct013_init(&sct_cfg));
#endif

    // 3. Initialize Wi-Fi Station
    wifi_station_init(WIFI_SSID, WIFI_PASSWORD);

    // 4. Initialize HTTP Telemetry Client
    telemetry_client_config_t tel_cfg = {
        .server_url = BACKEND_POST_URL,
        .device_id = DEVICE_ID,
        .transformer_id = TRANSFORMER_ID,
        .burden_ohms = sct_cfg.burden_ohms
    };
    ESP_ERROR_CHECK(telemetry_client_init(&tel_cfg));

    // 5. Spawn Real-Time Monitoring Task
    xTaskCreatePinnedToCore(
        sct013_monitor_task,
        "sct013_task",
        4096,
        NULL,
        5,
        NULL,
        1
    );

    ESP_LOGI(TAG, "SmartWatt ESP initialization completed successfully.");
}
