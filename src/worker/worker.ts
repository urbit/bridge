import { expose } from "comlink";
import { generateWallet } from './generateWalletWorker';

expose(generateWallet);
