import asyncio
from bleak import BleakScanner

# Define the UUID of the iBeacon you want to detect
IBEACON_UUID = "your-ibeacon-uuid-here"

async def scan_for_ibeacon():
    # Start scanning for BLE devices
    devices = await BleakScanner.discover()

    for device in devices:
        # Check if the device is an iBeacon by comparing its UUID
        if IBEACON_UUID in device.metadata.get('uuids', []):
            print(f"iBeacon detected: {device.name} ({device.address})")
            return

    print("iBeacon not found.")

# Run the scan
asyncio.run(scan_for_ibeacon())
