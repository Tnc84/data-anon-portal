/* eslint-disable */
/* API function for listing anonymized files */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

export interface ListFiles$Params {
}

export function listFiles(http: HttpClient, rootUrl: string, params?: ListFiles$Params, context?: HttpContext): Observable<StrictHttpResponse<string[]>> {
  const rb = new RequestBuilder(rootUrl, listFiles.PATH, 'get');

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<string[]>;
    })
  );
}

listFiles.PATH = '/api/v1/anonymization/files';
