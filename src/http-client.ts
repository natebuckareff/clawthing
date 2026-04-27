const MAX_REQUEST_DELAY = 1000;

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

interface HttpClientFetchInit extends RequestInit {
  requestKey?: string;
}

interface PendingRequest {
  input: FetchInput;
  init?: FetchInit;
  resolve: (response: Response) => void;
  reject: (error: unknown) => void;
}

export class HttpClient {
  private queue: PendingRequest[] = [];
  private fetchPromise?: Promise<void>;
  private inFlightRequests = new Map<string, Promise<Response>>();

  fetch(input: FetchInput, init?: HttpClientFetchInit): Promise<Response> {
    const { requestKey, fetchInit } = splitHttpClientInit(init);

    if (requestKey) {
      const inFlightRequest = this.inFlightRequests.get(requestKey);
      if (inFlightRequest) {
        return inFlightRequest.then((response) => response.clone() as Response);
      }
    }

    const promise = new Promise<Response>((resolve, reject) => {
      this.queue.push({
        input,
        init: fetchInit,
        resolve,
        reject,
      });
    });

    if (!this.fetchPromise) {
      this.fetchPromise = this.startFetch();
    }

    if (requestKey) {
      this.inFlightRequests.set(requestKey, promise);
      promise.then(
        () => {
          this.inFlightRequests.delete(requestKey);
        },
        () => {
          this.inFlightRequests.delete(requestKey);
        },
      );
      return promise.then((response) => response.clone() as Response);
    }

    return promise;
  }

  private async startFetch(): Promise<void> {
    try {
      while (this.queue.length > 0) {
        const request = this.queue.shift();
        if (!request) {
          continue;
        }

        const startedAt = performance.now();

        try {
          const response = await fetch(request.input, request.init);
          request.resolve(response);
        } catch (error: unknown) {
          request.reject(error);
        }

        const elapsed = performance.now() - startedAt;
        const remainingDelay = MAX_REQUEST_DELAY - elapsed;

        if (remainingDelay > 0) {
          await Bun.sleep(remainingDelay);
        }
      }
    } finally {
      this.fetchPromise = undefined;

      if (this.queue.length > 0) {
        this.fetchPromise = this.startFetch();
      }
    }
  }
}

function splitHttpClientInit(init: HttpClientFetchInit | undefined): {
  requestKey?: string;
  fetchInit?: FetchInit;
} {
  if (!init) {
    return {};
  }

  const { requestKey, ...fetchInit } = init;
  return {
    requestKey,
    fetchInit,
  };
}
