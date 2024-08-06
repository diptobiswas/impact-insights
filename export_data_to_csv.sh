#!/bin/bash

# Connection details
KV_URL=$(grep KV_URL .env | cut -d '=' -f2 | tr -d '"')
TLS="--tls"

# Check if KV_URL is set and print a masked version
if [ -z "$KV_URL" ]; then
    echo "Error: KV_URL is not set in the .env file"
    exit 1
else
    # Print masked URL for debugging
    masked_url=$(echo "$KV_URL" | sed 's/\/\/[^@]*@/\/\/****:****@/')
    echo "Using KV_URL: $masked_url"
fi

# Test Redis connection with verbose output
echo "Testing Redis connection..."
if ! redis-cli $TLS -u "$KV_URL" ping; then
    echo "Error: Unable to connect to Redis. Please check your KV_URL."
    echo "Debugging information:"
    redis-cli $TLS -u "$KV_URL" ping -v
    exit 1
fi

echo "Redis connection successful."

# CSV Header
echo "email,question" > user_questions.csv

# Function to extract all questions from messages
extract_questions() {
    local messages="$1"
    echo "$messages" | sed 's/},{/}\n{/g' | sed -n 's/.*"role":"user","content":"\([^"]*\)".*/\1/p'
}

# Connect to Redis and export data
redis-cli $TLS -u "$KV_URL" --scan --pattern 'user:*' | while read key; do
    if [[ $key == user:* && $key != *:chat:* ]]; then
        email=$(redis-cli $TLS -u "$KV_URL" hget "$key" email)
        user_id=$(redis-cli $TLS -u "$KV_URL" hget "$key" id)
        
        redis-cli $TLS -u "$KV_URL" --scan --pattern "chat:*" | while read chat_key; do
            chat_user_id=$(redis-cli $TLS -u "$KV_URL" hget "$chat_key" userId)
            if [ "$chat_user_id" = "$user_id" ]; then
                messages=$(redis-cli $TLS -u "$KV_URL" hget "$chat_key" messages)
                extract_questions "$messages" | while read -r question; do
                    if [ ! -z "$question" ]; then
                        echo "\"$email\",\"$question\"" >> user_questions.csv
                    fi
                done
            fi
        done
    fi
done

echo "Data export completed successfully."