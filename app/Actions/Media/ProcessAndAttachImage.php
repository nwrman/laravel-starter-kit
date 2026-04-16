<?php

declare(strict_types=1);

namespace App\Actions\Media;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;
use Spatie\Image\Enums\Fit;
use Spatie\Image\Image;
use Spatie\MediaLibrary\HasMedia;

final readonly class ProcessAndAttachImage
{
    public function handle(
        HasMedia $model,
        UploadedFile $file,
        int $maxWidth = 800,
        string $collection = 'photo',
        int $quality = 80,
    ): void {
        $extension = $file->guessExtension() ?? 'jpg';
        $tempPath = sys_get_temp_dir().'/'.Str::random(40).'.'.$extension;

        copy($file->getRealPath(), $tempPath);

        Image::load($tempPath)
            ->fit(Fit::Max, $maxWidth)
            ->format('webp')
            ->quality($quality)
            ->save();

        $webpPath = Str::beforeLast($tempPath, '.').'.webp';
        if ($webpPath !== $tempPath) {
            rename($tempPath, $webpPath);
        }

        $model->addMedia($webpPath)
            ->usingFileName(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME).'.webp')
            ->toMediaCollection($collection);
    }
}
