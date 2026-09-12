idf_component_register(
    SRCS 
        "main.c" 
        "sct013.c" 
        "dummy_load.c"
        "wifi_station.c" 
        "telemetry_client.c"
    INCLUDE_DIRS "."
    REQUIRES 
        esp_adc 
        esp_http_client 
        esp_wifi 
        esp_event 
        nvs_flash 
        esp_netif
        esp_timer
)
