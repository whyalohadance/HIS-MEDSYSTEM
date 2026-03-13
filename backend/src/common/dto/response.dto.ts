export class ApiResponse<T> {
  success: boolean;
  requestId: string;
  data?: T;
  error?: {
    code: number;
    message: string;
  };
  timestamp: string;

  static ok<T>(data: T, requestId: string): ApiResponse<T> {
    const res = new ApiResponse<T>();
    res.success = true;
    res.requestId = requestId;
    res.data = data;
    res.timestamp = new Date().toISOString();
    return res;
  }

  static fail(code: number, message: string, requestId: string): ApiResponse<null> {
    const res = new ApiResponse<null>();
    res.success = false;
    res.requestId = requestId;
    res.error = { code, message };
    res.timestamp = new Date().toISOString();
    return res;
  }
}
