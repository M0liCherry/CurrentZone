#include "telemetry_client.h"
#include <stdio.h>
#include <string.h>
#include "esp_log.h"
#include "esp_http_client.h"

static const char *TAG = "TELEMETRY_CLIENT";

static telemetry_client_config_t s_cfg;

esp_err_t telemetry_client_init(const telemetry_client_config_t *config)
{
    if (!config) return ESP_ERR_INVALID_ARG;
    s_cfg = *config;
    ESP_LOGI(TAG, "Telemetry Client initialized -> Target URL: %s (Device: %s)",
             s_cfg.server_url, s_cfg.device_id);
    return ESP_OK;
}

esp_err_t telemetry_client_post_metrics(const sct013_metrics_t *metrics)
{
    if (!metrics || !s_cfg.server_url) {
        return ESP_ERR_INVALID_ARG;
    }

    float tot_w = metrics->active_power_w;
    float tot_a = metrics->current_rms;
    float tot_e = metrics->energy_kwh_accumulated;

    char post_data[1024];
    int len = snprintf(
        post_data,
        sizeof(post_data),
        "{"
        "\"device_id\":\"%s\","
        "\"transformer_id\":\"%s\","
        "\"current_rms\":%.2f,"
        "\"power_kw\":%.3f,"
        "\"voltage_v\":%.1f,"
        "\"frequency_hz\":%.2f,"
        "\"energy_kwh_total\":%.4f,"
        "\"peak_surge_a\":%.2f,"
        "\"sample_count\":%lu,"
        "\"burden_ohms\":%.1f,"
        "\"appliances\":["
        "{\"id\":\"dev_ac_01\",\"name\":\"Living Room AC\",\"room\":\"Living Room\",\"power_w\":%.1f,\"current_a\":%.2f,\"daily_kwh\":%.3f},"
        "{\"id\":\"dev_heater_02\",\"name\":\"Water Heater\",\"room\":\"Bathroom\",\"power_w\":%.1f,\"current_a\":%.2f,\"daily_kwh\":%.3f},"
        "{\"id\":\"dev_fridge_03\",\"name\":\"Refrigerator\",\"room\":\"Kitchen\",\"power_w\":%.1f,\"current_a\":%.2f,\"daily_kwh\":%.3f},"
        "{\"id\":\"dev_cooktop_04\",\"name\":\"Kitchen Cooktop / Oven\",\"room\":\"Kitchen\",\"power_w\":%.1f,\"current_a\":%.2f,\"daily_kwh\":%.3f},"
        "{\"id\":\"dev_office_05\",\"name\":\"Home Office & Lighting\",\"room\":\"Home Office\",\"power_w\":%.1f,\"current_a\":%.2f,\"daily_kwh\":%.3f}"
        "]"
        "}",
        s_cfg.device_id ? s_cfg.device_id : "esp32_sct013_res_01",
        s_cfg.transformer_id ? s_cfg.transformer_id : "TX-RES-01",
        metrics->current_rms,
        metrics->active_power_w / 1000.0f,
        metrics->voltage_v > 0.0f ? metrics->voltage_v : 230.0f,
        metrics->frequency_hz > 0.0f ? metrics->frequency_hz : 50.0f,
        metrics->energy_kwh_accumulated,
        metrics->current_peak,
        (unsigned long)metrics->samples_taken,
        s_cfg.burden_ohms > 0 ? s_cfg.burden_ohms : 22.0f,
        tot_w * 0.44f, tot_a * 0.44f, tot_e * 0.44f,
        tot_w * 0.24f, tot_a * 0.24f, tot_e * 0.24f,
        tot_w * 0.10f, tot_a * 0.10f, tot_e * 0.10f,
        tot_w * 0.14f, tot_a * 0.14f, tot_e * 0.14f,
        tot_w * 0.08f, tot_a * 0.08f, tot_e * 0.08f
    );

    if (len < 0 || len >= sizeof(post_data)) {
        ESP_LOGE(TAG, "Failed to serialize JSON telemetry string");
        return ESP_ERR_NO_MEM;
    }

    esp_http_client_config_t http_cfg = {
        .url = s_cfg.server_url,
        .method = HTTP_METHOD_POST,
        .timeout_ms = 5000,
    };

    esp_http_client_handle_t client = esp_http_client_init(&http_cfg);
    if (!client) {
        ESP_LOGE(TAG, "Failed to init HTTP client");
        return ESP_FAIL;
    }

    esp_http_client_set_header(client, "Content-Type", "application/json");
    esp_http_client_set_post_field(client, post_data, strlen(post_data));

    esp_err_t err = esp_http_client_perform(client);
    if (err == ESP_OK) {
        int status = esp_http_client_get_status_code(client);
        ESP_LOGI(TAG, "Telemetry POST succeeded (Status %d): %.2f A (%.1f kW)",
                 status, metrics->current_rms, metrics->active_power_w / 1000.0f);
    } else {
        ESP_LOGW(TAG, "Telemetry POST failed: %s", esp_err_to_name(err));
    }

    esp_http_client_cleanup(client);
    return err;
}
