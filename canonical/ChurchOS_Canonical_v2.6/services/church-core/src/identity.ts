import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { JWTVerifyGetKey } from 'jose';
import type { IdentityPort, Principal } from './ports.js';
export class JwtIdentity implements IdentityPort {
  constructor(private readonly keys:JWTVerifyGetKey,private readonly issuer:string,private readonly audience:string) {}
  async verify(token:string):Promise<Principal>{
    const {payload}=await jwtVerify(token,this.keys,{issuer:this.issuer,audience:this.audience,algorithms:['RS256'],requiredClaims:['sub','iss','aud','exp','iat'],maxTokenAge:'15m',clockTolerance:5});
    if(!payload.sub || payload.sub.length>255)throw new Error('Invalid subject');
    // Token role/tenant claims are intentionally ignored; ChurchOS DB owns membership and roles.
    return Object.freeze({issuer:payload.iss!,subject:payload.sub});
  }
}
export function remoteIdentity(issuer:string,audience:string,jwks:string){
  for(const value of [issuer,jwks])if(new URL(value).protocol!=='https:')throw new Error('OIDC endpoints require HTTPS');
  return new JwtIdentity(createRemoteJWKSet(new URL(jwks),{timeoutDuration:5000}),issuer,audience);
}
