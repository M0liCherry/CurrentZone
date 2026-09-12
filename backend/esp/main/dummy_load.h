#pragma once

#include "sct013.h"

#ifdef __cplusplus
extern "C" {
#endif

/**
 * @brief Dummy load profile for testing without SCT-013 hardware.
 *
 * Generates a realistic, continuously varying current waveform:
 * - Base household/feeder load (~8-45 A typical, configurable)
 * - Slow sinusoidal daily-cycle drift
 * - Random walk noise (+/- 1.5 A per step)
 * - Occasional appliance surge spikes (kettle/AC inrush, 1.5x-2.5x for 1-2 windows)
 *
 * State is kept internally; call dummy_load_reset() to restart the profile.
 * All math is host-testable (no ESP-only APIs inside the generator except
 * esp_timer for energy integration — guarded so the file also compiles
 * in the Python-simulator reference model).
 */

/**
 * @brief Reset the dummy load generator to its initial state.
 */
void dummy_load_reset(void);

/**
 * @brief Generate the next dummy SCT-013 reading.
 *
 * @param[out] metrics  Pointer to metrics struct to fill.
 * @param nominal_voltage Grid RMS voltage in Volts (e.g. 230.0).
 * @param power_factor    Assumed power factor (e.g. 0.92).
 * @return ESP_OK on success (always succeeds for dummy data).
 */
esp_err_t dummy_load_next(sct013_metrics_t *metrics, float nominal_voltage, float power_factor);

#ifdef __cplusplus
}
#endif
