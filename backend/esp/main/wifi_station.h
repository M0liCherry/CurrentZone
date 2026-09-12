#pragma once

#include <stdbool.h>
#include "esp_err.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Initialize Wi-Fi in station mode with automatic reconnect logic.
 *
 * @param ssid Wi-Fi SSID
 * @param password Wi-Fi password
 * @return esp_err_t ESP_OK on success
 */
esp_err_t wifi_station_init(const char *ssid, const char *password);

/**
 * @brief Returns whether Wi-Fi station is currently connected and has an acquired IP.
 */
bool wifi_station_is_connected(void);

#ifdef __cplusplus
}
#endif
