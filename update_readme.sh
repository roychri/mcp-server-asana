#!/bin/bash

# Function to build the --read arguments for tool files
build_read_args() {
    local read_args=""
    # Add the core files first
    read_args="--read src/index.ts --read src/tool-handler.ts"

    # Add each tool file found in src/tools/
    for file in src/tools/*.ts; do
        if [ -f "$file" ]; then
            read_args="$read_args --read $file"
        fi
    done
    echo "$read_args"
}

# Get the read arguments
READ_ARGS=$(build_read_args)

conda run -n aider aider \
      --haiku \
      --yes-always \
      --no-check-update \
      $READ_ARGS \
      --message "Modify the README's list of tools based on the code.
Only update the list of tools and NOTHING else. Make sure you indicate
the list of tools, their description, their required/optional input and return values.
Keep the same format, structure, style, and spacing." \
      README.md

conda run -n aider aider \
      --haiku \
      --yes-always \
      --no-check-update \
      --read src/index.ts \
      --message "Modify the README's list of prompts based on the code.
Only update the list of prompt and NOTHING else. Make sure you indicate
the list of prompts, their description, their input and return values.
Remember that prompts returns prompts, not what the prompt instructions says.
Good: Returns: A detailed prompt with instructions that ...
Bad: Returns: A full project brief that ...
Keep the same format, structure, style, and spacing." \
      README.md
