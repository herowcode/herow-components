"use client"

import Image from "next/image"
import type React from "react"
import { forwardRef, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface OptimizedImageProps
  extends React.ComponentPropsWithoutRef<typeof Image> {
  fallbackText?: string
  lazyLoad?: boolean // New prop to control lazy loading behavior
}

export const OptimizedImage = forwardRef<HTMLImageElement, OptimizedImageProps>(
  function OptimizedImage(
    {
      src,
      alt,
      width,
      height,
      className,
      fallbackText = "Falha ao carregar a imagem",
      lazyLoad = true, // Default to true for lazy loading
      onLoad,
      sizes,
      ...props
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [isInView, setIsInView] = useState(!lazyLoad) // Start as true if lazyLoad is false

    // Set up intersection observer to detect when image enters viewport
    useEffect(() => {
      if (!lazyLoad || !containerRef.current) {
        setIsInView(true)
        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect() // Cleanup once image is loaded
          }
        },
        { rootMargin: "200px" }, // Start loading slightly before it enters viewport
      )

      observer.observe(containerRef.current)

      return () => {
        observer.disconnect()
      }
    }, [lazyLoad])

    const handleLoad = (ev: React.SyntheticEvent<HTMLImageElement, Event>) => {
      setIsLoading(false)
      onLoad?.(ev)
    }

    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
    }

    return (
      <div
        ref={containerRef}
        className="relative overflow-hidden"
        style={{
          width: typeof width === "number" ? `${width}px` : width || "100%",
          height: typeof height === "number" ? `${height}px` : height || "100%",
        }}
      >
        {/* Skeleton loader */}
        {isLoading && (
          <div
            className="bg-muted absolute inset-0 animate-pulse rounded-md"
            style={{ width: "100%", height: "100%" }}
          />
        )}

        {/* Error state */}
        {hasError ? (
          <div className="bg-muted text-muted-foreground absolute inset-0 flex items-center justify-center rounded-md text-center text-sm">
            {fallbackText}
          </div>
        ) : (
          /* Only render the image when in viewport or lazyLoad is disabled */
          isInView && (
            <Image
              ref={ref}
              src={src || "/placeholder.svg"}
              alt={alt}
              width={width ? Number(width) : undefined}
              height={height ? Number(height) : undefined}
              sizes={
                sizes ||
                "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              }
              quality={80}
              loading={props.priority ? "eager" : "lazy"}
              className={cn(
                "rounded-md object-cover transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100",
                className,
              )}
              onLoad={handleLoad}
              onError={handleError}
              placeholder="blur"
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAEtAI8V7yQCgAAAABJRU5ErkJggg=="
              {...props}
            />
          )
        )}
      </div>
    )
  },
)
