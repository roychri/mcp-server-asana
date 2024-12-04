#!/bin/bash

conda run -n aider aider \
      --haiku \
      --yes-always \
      --no-check-update \
      --read src/index.ts \
      --message "Modify the README's list of tools based on the code.
Only update the list of tools and NOTHING else. Make sure you indicate
the list of tools, their description, their required/optional input and return values." \
      README.md

conda run -n aider aider \
      --haiku \
      --yes-always \
      --no-check-update \
      --read src/index.ts \
      --message "Modify the README's list of prompts based on the code.
Only update the list of prompt and NOTHING else. Make sure you indicate
the list of prompts, their description, their input and return values." \
      README.md
