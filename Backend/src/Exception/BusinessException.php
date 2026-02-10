<?php

namespace App\Exception;

class BusinessException extends \Exception
{
    public function __construct(string $message = 'Business logic error', int $code = 400, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}

