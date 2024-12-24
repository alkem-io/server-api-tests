import { Client, createClient, SubscribePayload } from 'graphql-ws';
import { GraphQLError } from 'graphql';
import { TestUser } from '@alkemio/tests-lib';
import { buildConnectionParams } from './build-connection-params';

const SERVER_URL_WS = process.env.ALKEMIO_SERVER_WS ?? '';

type SubscriptionCleanUpFn = () => void;
export type SubscriptionMessage = Record<string, unknown> | null | undefined;

export class SubscriptionClient {
  private client: Client | undefined;
  private readonly _messages: SubscriptionMessage[] = [];
  private readonly errors: GraphQLError[] = [];
  /** do not use directly */
  private _terminateFn: SubscriptionCleanUpFn | undefined;

  /**
   * Lazy function to subscribes to an url provided by SERVER_URL_WS variable through the Websocket protocol with a payload and a user.
   * @param payload Payload to send on subscription
   * @param user The user with whom the subscription will be made. This user is used for authorization
   * over the resource you are going to subscribe to so make sure this user has the sufficient privileges.
   * @return A promise which is resolved after the _connected_ state event is received.
   * This ensures messages are received as expected and in timely manner
   */
  public subscribe(payload: SubscribePayload, user: TestUser): Promise<void> {
    return new Promise<void>((res, rej) => {
      this.client = createClient({
        url: SERVER_URL_WS,
        webSocketImpl: WebSocket,
        connectionParams: async () => await buildConnectionParams(user),
      });

      this._terminateFn = this.client.subscribe(payload, {
        next: data => {
          if (data.errors?.length) {
            this.terminate();
            this.errors.push(...data.errors);
          }

          this._messages.push(data.data);
        },
        error: err => {
          this.terminate();
          throw new Error((err as Error).message);
        },
        complete: () => null,
      });

      this.client.on('connected', () => res());
      this.client.on('error', () => rej());
    });
  }
  /**
   * Terminates the WebSocket abruptly and immediately.
   *
   * A close event `4499: Terminated` is issued to the current WebSocket and an
   * artificial `{ code: 4499, reason: 'Terminated', wasClean: false }` close-event-like
   * object is immediately emitted without waiting for the one coming from `WebSocket.onclose`.
   *
   * Terminating is not considered fatal and a connection retry will occur as expected.
   */
  public terminate(): void {
    this._terminateFn?.();
    this.client?.terminate();
  }
  /** Returns all received errors */
  public getErrors(): GraphQLError[] {
    return this.errors;
  }
  /** Returns all the received messages so far or throws on received errors */
  public getMessages(): SubscriptionMessage[] | never {
    if (this.errors.length) {
      throw new Error('Unable to access messages due to errors received');
    }
    return this._messages;
  }
  /** Returns the latest received message */
  public getLatest(): SubscriptionMessage | undefined {
    return this.getMessages().slice(-1)?.[0];
  }
  /** Returns the first received message */
  public getFirst(): SubscriptionMessage | undefined {
    return this.getMessages().slice(0)?.[0];
  }
}
