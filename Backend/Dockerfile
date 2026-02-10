FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first (for better caching)
COPY composer.json composer.lock* ./

# Install PHP dependencies
RUN composer install --prefer-dist --no-interaction --no-scripts

# Copy application files
COPY . .

# Complete composer install with scripts
RUN composer dump-autoload --optimize

# Create var directory if it doesn't exist
RUN mkdir -p /var/www/html/var/cache /var/www/html/var/log

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/var

# Expose port 8005
EXPOSE 8005

# Start Symfony server on port 8005
CMD ["php", "-S", "0.0.0.0:8005", "-t", "public"]

