#!/bin/bash

# Fixes permissions so that the container can read all it needs.
# (this might not be needed, depending on what default permissions
# are applied when the repository is cloned)
# The .env file is changed to be usable only by the user.
# Files inside the certs and .git folders are not changed.

# change all the directories to 755 (drwxr-xr-x), except .git
find . -type d -not -path './.git*' -exec chmod 755 {} \;

# change all the files to 644 (-rw-r--r--), except for .env and files inside certs or .git
find . -type f -not -path './.env' -not -path './certs*' -not -path './.git*' -exec chmod 644 {} \;

# change script permissions to 755 (drwxr-xr-x)
find . -type f -path './*.sh' -exec chmod 755 {} \;

# change .env to 600 (-rw-------)
chmod 600 .env
