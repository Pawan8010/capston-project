#!/bin/bash
set -e

cd "$(dirname "$0")/../ml-service"
pip install -r requirements.txt
python train.py
