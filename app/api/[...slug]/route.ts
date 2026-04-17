/**
 * Catch-all API proxy for all /api/* requests.
 * Forwards all requests to the backend.
 */

import { NextRequest, NextResponse } from 'next/server';

async function proxyHandler(
  request: NextRequest,
  context: { params: Promise<{ slug: string[] }> }
): Promise<NextResponse> {
  try {
    // Use localhost:8000 directly
    const backendUrl = 'http://localhost:8000';
    
    // Await the params
    const { slug } = await context.params;
    
    // Reconstruct the path from the catch-all parameter
    const path = '/' + (slug ? slug.join('/') : '');
    const fullPath = `/api${path}${request.nextUrl.search}`;
    const targetUrl = `${backendUrl}${fullPath}`;
    
    const method = request.method;
    console.log(`[API PROXY] ${method} ${fullPath} -> ${targetUrl}`);
    
    // Prepare the request body
    let body: BodyInit | undefined = undefined;
    
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      // For these methods, use the buffer directly
      body = await request.arrayBuffer();
    }
    
    // Forward headers, excluding host and connection
    const forwardHeaders = new Headers(request.headers);
    forwardHeaders.delete('host');
    forwardHeaders.delete('connection');
    // Remove content-length so it's recalculated by fetch
    forwardHeaders.delete('content-length');
    
    // Make the request to the backend
    const response = await fetch(targetUrl, {
      method,
      headers: forwardHeaders,
      body: body && body.byteLength > 0 ? body : undefined,
      credentials: 'include',
    });
    
    console.log(`[API PROXY] ${method} ${fullPath} -> ${response.status}`);
    
    // Forward the response back to the client
    const responseBody = await response.arrayBuffer();
    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    console.error(`[API PROXY] Error:`, error);
    return NextResponse.json(
      { error: 'Backend unavailable', details: String(error) },
      { status: 503 }
    );
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;
export const HEAD = proxyHandler;
export const OPTIONS = proxyHandler;
