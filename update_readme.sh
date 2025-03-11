#!/bin/bash

# Check if conda is installed
if ! command -v conda &> /dev/null; then
    echo "Error: conda is not installed or not in PATH"
    echo "Please install conda first: https://docs.conda.io/en/latest/miniconda.html"
    exit 1
fi

# Check if aider environment exists
if ! conda env list | grep -q "^aider "; then
    echo "Error: conda environment 'aider' does not exist"
    echo "Please create it first: conda create -n aider python=3.11"
    echo "Then install aider: conda activate aider && pip install aider-chat"
    exit 1
fi

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
      --read src/prompt-handler.ts \
      --message "Modify the README's list of prompts based on the code.
Only update the list of prompt and NOTHING else. Make sure you indicate
the list of prompts, and their description.
Remember that prompts returns prompts, not what the prompt instructions says.
Good: Returns: A detailed prompt with instructions that ...
Bad: Returns: A full project brief that ...
Keep the same format, structure, style, and spacing." \
      README.md

conda run -n aider aider \
      --haiku \
      --yes-always \
      --no-check-update \
      --read src/resource-handler.ts \
      --message "Modify the README's list of resources based on the code.
Only update the list of resources and NOTHING else. Make sure you indicate
the list of resources, their description, and return values.
Keep the same format, structure, style, and spacing." \
      README.md
