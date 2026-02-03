import type React from "react"
import { forwardRef, useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface OptimizedImageProps
  extends Omit<React.ComponentPropsWithoutRef<"img">, "width" | "height"> {
  fallbackText?: string
  lazyLoad?: boolean
  width?: number | string
  height?: number | string
  priority?: boolean
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
      lazyLoad = true,
      priority = false,
      onLoad,
      ...props
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [isInView, setIsInView] = useState(!lazyLoad)

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
            observer.disconnect()
          }
        },
        { rootMargin: "200px" },
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
          isInView && (
            <img
              ref={ref}
              src={src || "/placeholder.svg"}
              alt={alt}
              width={width ? Number(width) : undefined}
              height={height ? Number(height) : undefined}
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className={cn(
                "rounded-md object-cover transition-opacity duration-300",
                isLoading ? "opacity-0" : "opacity-100",
                className,
              )}
              onLoad={handleLoad}
              onError={handleError}
              {...props}
            />
          )
        )}
      </div>
    )
  },
)
