#!/usr/bin/env python

from tornado import websocket, web, ioloop
import serial
import threading

serial_port = '/dev/ttyACM3'

clients = set()


class ManInTheMiddle(threading.Thread):
    def __init__(self):
        super(ManInTheMiddle, self).__init__()
        self.tty = serial.Serial(serial_port, 9600)
        #self.tty.setTimeout(.01)

    def run(self):
        while True:
            line = self.tty.readline()
            try:
                direction, row, col = line.split(' ')
                row = int(row)
                col = int(col)
            except Exception as e:
                print e, line
            else:
                if direction in ('U', 'D'):
                    send_event(direction, row, col)


def send_event(direction, row, col):
    message = '%s %s %s' % (direction, row, col)
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
