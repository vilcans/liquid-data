#!/usr/bin/env python

import sys
import serial
import time

start = time.time()

name = '/dev/ttyACM3'
print 'Monitoring', name
#tty = serial.Serial(name, 31250)
tty = serial.Serial(name, 9600)
tty.setTimeout(.01)

values = [
    [' ', ' ', ' '],
    [' ', ' ', ' '],
    [' ', ' ', ' '],
]

try:
    while True:
        r = tty.readline()
        if not r:
            continue
        try:
            direction, row, col = r.split(' ')
        except Exception as e:
            print e, r
            continue

        row = int(row)
        col = int(col)
        values[row][col] = 'X' if direction == 'D' else '-'
        print
        print '  012'
        for rowno, row in reversed(list(enumerate(values))):
            print rowno, ''.join(row)
except KeyboardInterrupt:
    pass
