
# Setup

- Install ESPHome [https://esphome.io/guides/installing_esphome]

- Download one of the CH343 drivers for this particular ESP32 board. [https://wch-ic.com/search?t=all&q=ch343]
  - (As a note, I am usually against downloading arbitrary drivers from a security perspective; I apologize in advance for choosing this board and making you download this driver! If you'd rather not download this driver, feel free to use [this board](https://www.amazon.com/ESP-WROOM-32-Development-Microcontroller-Integrated-Compatible/dp/B08D5ZD528?crid=2YL78008PMNDL&dib=eyJ2IjoiMSJ9.BIu3I9Sm5to7GVTumKqgP67op2hMtpwF80mJByziDxX1o2N4IpgFfxSJMsSMd7dIn2EgpKwLFLruBJEPyAOh-DgyIFMd1J2kFYG5a6FS3Zc-toH9UN-GYZ5m1w-BIvXsDXFzAwJgTL4UmrmAOoSKp6TNDcljUfx9421YtJtXivtooZwd2_8AGKucUXF_nuaSUbPF1-WJwM6KDPfLbYw6kyrClBKAYd8X0A4HbOHtDpA.PpQPr9olL2c063G_s9xqqz2vYNY4dyR0vtzTliF-5J4&dib_tag=se&keywords=esp32&qid=1727299280&sprefix=esp32,aps,134&sr=8-2).)

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

# 'Flash' and Run ESPHome file

In terminal, type `esphome run metatool1.yaml`.
