/* eslint-disable */
/* API function for file upload and anonymization */

import { HttpClient, HttpContext, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { StrictHttpResponse } from '../../strict-http-response';
import { RequestBuilder } from '../../request-builder';

import { FileAnonymizationResponse } from '../../models/file-anonymization-response';

export interface UploadAnonymize$Params {
  body: FormData;
}

export function uploadAnonymize(http: HttpClient, rootUrl: string, params: UploadAnonymize$Params, context?: HttpContext): Observable<StrictHttpResponse<FileAnonymizationResponse>> {
  const rb = new RequestBuilder(rootUrl, uploadAnonymize.PATH, 'post');
  if (params) {
    rb.body(params.body, 'multipart/form-data');
  }

  return http.request(
    rb.build({ responseType: 'json', accept: 'application/json', context })
  ).pipe(
    filter((r: any): r is HttpResponse<any> => r instanceof HttpResponse),
    map((r: HttpResponse<any>) => {
      return r as StrictHttpResponse<FileAnonymizationResponse>;
    })
  );
}

uploadAnonymize.PATH = '/api/v1/anonymization/upload-anonymize';
