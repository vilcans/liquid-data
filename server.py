#!/usr/bin/env python

from tornado import websocket, web, ioloop
from time import sleep
import serial
import threading

serial_port = '/dev/ttyACM4'

clients = set()
ROWS = 5
COLS = 4

last_known_state = ','.join('0' * COLS for r in range(ROWS))


class ManInTheMiddle(threading.Thread):
    def __init__(self):
        super(ManInTheMiddle, self).__init__()

    def start_serial(self):
        print 'starting serial'
        self.tty = serial.Serial(serial_port, 9600)
        #self.tty.setTimeout(.01)

    def run(self):
        print 'Starting thread'
        self.start_serial()
        while True:
            try:
                line = self.tty.readline().strip()
                if not line:
                    continue
                print 'Received:', line
                rows = line.split(',')
                if len(rows) != ROWS or any(len(r) != COLS for r in rows):
                    print 'wrong format'
                    continue
                global last_known_state
                last_known_state = line
                send_event(line)
            except Exception as e:
                print 'Serial receive failed', e
                self.tty.close()
                sleep(2)
                self.start_serial()


def send_event(message):
    print 'Sending %s to %d clients' % (message, len(clients))
    for client in clients:
        try:
            client.write_message(message)
        except Exception as e:
            print 'Failed to send %s to %s: %s' % (message, client, e)


class BarWebSocketHandler(websocket.WebSocketHandler):
    def open(self):
        print "WebSocket opened", self
        clients.add(self)
        print 'Sending last known state', last_known_state, 'to', self
        self.write_message(last_known_state)

    def on_message(self, message):
        self.write_message(u"You said: " + message)

    def on_close(self):
        print "WebSocket closed", self
        clients.remove(self)


class IndexHandler(web.RequestHandler):
    def get(self):
        self.render('index.html')

app = web.Application([
    (r'/', IndexHandler),
    (r'/events', BarWebSocketHandler),
])

if __name__ == '__main__':
    man_in_the_middle = ManInTheMiddle()
    man_in_the_middle.daemon = True
    man_in_the_middle.start()
    app.listen(8888)
    ioloop.IOLoop.instance().start()
