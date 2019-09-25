#!/bin/bash

# On Linux, for shared volumes, permissions are shared between the host and the container.
# This directory is shared to make it easy to update the certificates.
# Read-only files in this directory will not be readable in the container
# if they are not owned by user 1000 (the container user id).

sudo chown 1000 server.key
