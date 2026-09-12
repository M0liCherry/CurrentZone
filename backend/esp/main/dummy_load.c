#include "dummy_load.h"
#include <math.h>
#include <stdlib.h>
#include "esp_log.h"
#include "esp_timer.h"

static const char *TAG = "DUMMY_LOAD";

// Persistent generator state
static bool s_seeded = false;
static float s_base_amps = 24.0f;          // Typical feeder branch load
static float s_random_walk = 0.0f;         // Random-walk offset
static float s_energy_kwh = 0.0f;          // Accumulated energy
static int64_t s_last_us = 0;
static uint32_t s_step = 0;
static uint32_t s_surge_remaining = 0;     // Windows left in current surge
static float s_surge_mult = 1.0f;

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

void dummy_load_reset(void)
{
    s_seeded = false;
    s_random_walk = 0.0f;
    s_energy_kwh = 0.0f;
    s_last_us = 0;
    s_step = 0;
    s_surge_remaining = 0;
    s_surge_mult = 1.0f;
}

esp_err_t dummy_load_next(sct013_metrics_t *metrics, float nominal_voltage, float power_factor)
{
    if (!metrics) {
        return ESP_ERR_INVALID_ARG;
    }

    if (!s_seeded) {
        // Seed from timer + MAC-ish entropy; rand() is fine for dummy data.
        srand((unsigned)(esp_timer_get_time() & 0xFFFFFFFF));
        s_last_us = esp_timer_get_time();
        s_seeded = true;
        ESP_LOGI(TAG, "Dummy load generator started (base %.1f A, %.0f V, PF %.2f)",
                 s_base_amps, nominal_voltage, power_factor);
    }

    s_step++;

    // 1. Slow daily-cycle drift: +/- 35% over a ~90-step (~4.5 min) period
    //    so dashboards visibly move during a demo without waiting hours.
    float drift = sinf((float)s_step * 2.0f * (float)M_PI / 90.0f) * 0.35f;

    // 2. Random walk: +/- 1.5 A per 3 s window, clamped to +/- 8 A.
    float noise = ((float)rand() / (float)RAND_MAX - 0.5f) * 3.0f;
    s_random_walk += noise;
    if (s_random_walk > 8.0f) s_random_walk = 8.0f;
    if (s_random_walk < -8.0f) s_random_walk = -8.0f;

    // 3. Occasional appliance surge: ~8% chance per window to start a
    //    1-2 window inrush at 1.5x-2.5x (kettle / AC compressor / motor).
    if (s_surge_remaining == 0 && (rand() % 100) < 8) {
        s_surge_remaining = 1 + (rand() % 2);
        s_surge_mult = 1.5f + ((float)rand() / (float)RAND_MAX) * 1.0f;
        ESP_LOGI(TAG, "Dummy appliance surge: x%.2f for %lu window(s)",
                 s_surge_mult, (unsigned long)s_surge_remaining);
    }

    float surge = 1.0f;
    if (s_surge_remaining > 0) {
        surge = s_surge_mult;
        s_surge_remaining--;
    }

    float current_rms = (s_base_amps * (1.0f + drift) + s_random_walk) * surge;
    if (current_rms < 0.5f) current_rms = 0.5f;
    if (current_rms > 98.0f) current_rms = 98.0f;  // Stay under 100 A sensor max

    float current_peak = current_rms * 1.4142f * (surge > 1.0f ? 1.15f : 1.0f);
    float apparent_va = nominal_voltage * current_rms;
    float active_w = apparent_va * power_factor;

    // Energy integration over real elapsed time
    int64_t now_us = esp_timer_get_time();
    if (s_last_us > 0) {
        double dt_h = (double)(now_us - s_last_us) / (3600.0 * 1000000.0);
        if (dt_h > 0.0 && dt_h < 1.0) {
            s_energy_kwh += (float)((double)(active_w / 1000.0f) * dt_h);
        }
    }
    s_last_us = now_us;

    metrics->current_rms = current_rms;
    metrics->current_peak = current_peak;
    metrics->apparent_power_va = apparent_va;
    metrics->active_power_w = active_w;
    metrics->energy_kwh_accumulated = s_energy_kwh;
    metrics->samples_taken = 500;
    metrics->bias_voltage_mv = 1650.0f;

    return ESP_OK;
}
