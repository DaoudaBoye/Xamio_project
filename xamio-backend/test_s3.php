<?php
require "vendor/autoload.php";
$app = require "bootstrap/app.php";
$app->make("Illuminate\Contracts\Console\Kernel")->bootstrap();
error_reporting(E_ALL);
$s3 = Illuminate\Support\Facades\Storage::disk("s3");
echo "Bucket: " . config("filesystems.disks.s3.bucket") . PHP_EOL;
echo "Region: " . config("filesystems.disks.s3.region") . PHP_EOL;
echo "Key: " . substr(config("filesystems.disks.s3.key"), 0, 10) . "..." . PHP_EOL;
$result = $s3->put("test.txt", "hello");
echo $result ? "OK" : "FAIL";
