
import sys
print('sys.path[0]=', sys.path[0])
try:
    import audioop
    print('audioop ok')
except Exception as e:
    print('audioop error', type(e).__name__, e)
try:
    import pyaudioop
    print('pyaudioop ok')
except Exception as e:
    print('pyaudioop error', type(e).__name__, e)
