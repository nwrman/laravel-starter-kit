<?php

declare(strict_types=1);

namespace App\Support\Media;

use App\Models\User;
use Illuminate\Support\Str;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\MediaLibrary\Support\PathGenerator\PathGenerator;

/**
 * Organizes media files into human-readable paths based on model and collection.
 *
 * Structure: {model_prefix}/{model_id}/{collection}/{media_id}/
 * Example:   users/01JRCX7M.../photo/14/john.webp
 *            users/01JRCX7M.../photo/14/conversions/john-thumb.webp
 */
final class CollectionPathGenerator implements PathGenerator
{
    /** @var array<class-string, string> */
    private const array MODEL_PREFIXES = [
        User::class => 'users',
        // Phase 2: Member::class => 'members',
    ];

    public function getPath(Media $media): string
    {
        return $this->getBasePath($media).'/';
    }

    public function getPathForConversions(Media $media): string
    {
        return $this->getBasePath($media).'/conversions/';
    }

    public function getPathForResponsiveImages(Media $media): string
    {
        return $this->getBasePath($media).'/responsive-images/';
    }

    private function getBasePath(Media $media): string
    {
        $prefix = self::MODEL_PREFIXES[$media->model_type]
            ?? Str::plural(Str::kebab(class_basename($media->model_type)));

        return sprintf('%s/%s/%s/%s', $prefix, $media->model_id, $media->collection_name, $media->id);
    }
}
