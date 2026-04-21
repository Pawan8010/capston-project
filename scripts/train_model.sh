#!/bin/bash
# Train the ML model
cd ml-service
pip install tensorflow pillow numpy
python train.py
