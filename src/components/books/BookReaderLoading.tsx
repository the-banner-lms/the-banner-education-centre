export default function BookReaderLoading({ message = 'Preparing your book…' }: { message?: string }) {
  return (
    <div className="flipbook-stage" role="status" aria-live="polite">
      <div className="flipbook-loading-preview">
        <div className="flipbook-loading-book" aria-hidden="true">
          <div className="flipbook-loading-page flipbook-loading-cover">
            <div className="flipbook-loading-cover-placeholder">
              <span>The Banner</span>
            </div>
          </div>
          <div className="flipbook-loading-page flipbook-loading-paper">
            <span className="flipbook-loading-line flipbook-loading-line-wide" />
            <span className="flipbook-loading-line" />
            <span className="flipbook-loading-line flipbook-loading-line-short" />
          </div>
        </div>
        <div className="flipbook-loading-status">
          <span className="flipbook-loading-spinner" aria-hidden="true" />
          <span>{message}</span>
        </div>
      </div>
    </div>
  )
}
