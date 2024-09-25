
# Setup

- Install ESPHome [https://esphome.io/guides/installing_esphome]

# Create an ESPHome project!

Open a terminal 
- in Mac, this is /Applications/Utilities/Terminal.app
- on the PC, You can do this by opening the Start menu, type Windows PowerShell, select Windows PowerShell, then select Open.

In terminal, 
- type `esphome wizard metatool1.yaml`. A wizard should appear!
- Give your ESPHome a name. e.g. 'metatool1' or 'livingroom'.
- The platform is `esp32`.
- For the board, type in `esp32-s3-devkitc-1`.
- For wifi, type in the wifi SSID and password. We'll be able to add multiple networks later.
- Lastly, for OTA password, set a password, if you wish - I recommend just pressing enter.

It should create a `metatool1.yaml` file in the directory it is currently in!

Open the file in a editor of your choice (such as Visual Studio Code).

Add in this code at the end of the YAML file:
```
light:
  - platform: neopixelbus
    type: GRB
    variant: WS2812
    pin: GPIO48
    num_leds: 60
    name: "NeoPixel Light
```

