#!/bin/bash

conda run -n aider aider \
      --haiku \
      --yes-always \
      --no-check-update \
      --read src/index.ts \
      --message "Modify the README's list of tools based on the code.
Only update the list of code and NOTHING else. Make sure you indicate
the list of tools, their description, their required/optional input and return values." \
      README.md
