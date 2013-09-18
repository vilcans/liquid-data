// rows
const int sendPins[] = {
  //2, 3, 4, 5, 6
  6, 5, 4, 3, 2
};
const int NUMBER_OF_SEND_PINS = sizeof(sendPins) / sizeof(sendPins[0]);

// columns
const int receivePins[] = {
  A4, A5, 12, 11, 10, 9, 8
  //7, 8, 9, 10, 11, 12, A5, A4
  //7, 8, 9, 10, 11, 12, A5, A4
};
const int NUMBER_OF_RECEIVE_PINS = sizeof(receivePins) / sizeof(receivePins[0]);

byte values[NUMBER_OF_SEND_PINS][NUMBER_OF_RECEIVE_PINS];

void setup() {
  for(int i = 0; i < NUMBER_OF_SEND_PINS; ++i) {
    pinMode(sendPins[i], OUTPUT);
  }
  for(int i = 0; i < NUMBER_OF_RECEIVE_PINS; ++i) {
    pinMode(receivePins[i], INPUT);
  }
  for(int row = 0; row < NUMBER_OF_SEND_PINS; ++row) {
    for(int col = 0; col < NUMBER_OF_RECEIVE_PINS; ++col) {
      values[row][col] = 0;
    }
  }
  Serial.begin(9600); 
}

void loop() {
  bool changed = false;
  for(int row = 0; row < NUMBER_OF_SEND_PINS; ++row) {
    int sendPin = sendPins[row];
    digitalWrite(sendPin, HIGH);
    for(int col = 0; col < NUMBER_OF_RECEIVE_PINS; ++col) {
      int receivePin = receivePins[col];
      int value = digitalRead(receivePin);
      if(value == HIGH) {
        if(!values[row][col]) {
          changed = true;
          values[row][col] = 1;
        }
      }
      else {
        if(values[row][col]) {
          values[row][col] = 0;
          changed = true;
        }
      }
    }
    digitalWrite(sendPin, LOW);
    delay(1);                     
  }
  if(changed) {
    for(int row = 0; row < NUMBER_OF_SEND_PINS; ++row) {
      for(int col = 0; col < NUMBER_OF_RECEIVE_PINS; ++col) {
        Serial.print(values[row][col] ? '1' : '0');
      }
      if(row != NUMBER_OF_SEND_PINS - 1) {
        Serial.print(',');
      }
    }
    Serial.println();
  }

  delay(100);                     
}
