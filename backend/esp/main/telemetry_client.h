#pragma once

#include "sct013.h"
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
    const char *server_url;     /*!< e.g. "http://192.168.1.100:8000/api/telemetry/ingest" */
    const char *device_id;      /*!< e.g. "esp32_sct013_res_01" */
    const char *transformer_id; /*!< e.g. "TX-RES-01" */
    float burden_ohms;          /*!< e.g. 22.0 */
} telemetry_client_config_t;

/**
 * @brief Initializes HTTP telemetry client configuration.
 */
esp_err_t telemetry_client_init(const telemetry_client_config_t *config);

/**
 * @brief Posts computed SCT-013 metrics to SmartWatt backend.
 *
 * @param metrics Pointer to current reading metrics
 * @return esp_err_t ESP_OK if HTTP POST succeeded with status 200
 */
esp_err_t telemetry_client_post_metrics(const sct013_metrics_t *metrics);

#ifdef __cplusplus
}
#endif
