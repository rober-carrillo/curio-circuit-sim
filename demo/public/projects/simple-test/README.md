# Simple Test Project

This is a minimal test project to verify:
1. Button input works
2. LED output works  
3. Buzzer output works
4. Port listeners work correctly

## Components
- 1 LED (pin 9) - controlled by Button 1
- 1 Buzzer (pin 8) - controlled by Buttons 2-5 with different pitches
- 5 Buttons (pins 2-6) - INPUT_PULLUP

## How to Test

1. Load `diagram.json` in the generic renderer
2. Load `simple-test.ino` code
3. Click "Run"
4. Press buttons:
   - **Button 1**: Should light up LED
   - **Button 2**: Should play C4 (262 Hz)
   - **Button 3**: Should play D4 (294 Hz)
   - **Button 4**: Should play E4 (330 Hz)
   - **Button 5**: Should play G4 (392 Hz)

## Expected Behavior

- **LED**: Should turn ON when Button 1 is pressed, OFF when released
- **Buzzer**: Should play different pitches for each button (2-5)
- **Console**: Should show `[LED DEBUG]` and `[BUZZER DEBUG]` messages
- **Port States**: PORTB should change when LED is on (bit 1 = pin 9)

## Debugging

Check console for:
- `[BUTTON DEBUG]` - Button press/release events
- `[LED DEBUG]` - LED state changes
- `[BUZZER DEBUG]` - Buzzer state changes
- `[PORT DEBUG]` - Port value changes
- `[SIM DEBUG]` - Periodic port state snapshots

If LED doesn't light:
- Check if PORTB bit 1 (pin 9) is changing
- Check if `[LED DEBUG]` messages appear
- Verify button is actually setting pin LOW

If Buzzer doesn't sound:
- Check if PORTB bit 0 (pin 8) is changing
- Check if `[BUZZER DEBUG]` messages appear
- Verify timer is generating PWM (might need timer monitoring)

