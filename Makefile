
# Call with e..g.
# make SERIALDEV=/dev/ttyACM0 upload

BOARD=uno
SERIALDEV=/dev/ttyACM4
CPPFLAGS=-save-temps

include arduino.mk


# gcc -c -g -Wa,-a,-ad [other GCC options] foo.c > foo.lst
