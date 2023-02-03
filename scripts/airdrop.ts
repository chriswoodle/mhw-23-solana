import { mintTo }  from "@solana/spl-token";
import { shotMintKeypair, connection, randomPayer } from "./config";
import { TokenHelper } from "./utils/token-helper";
import { User } from "./utils/user";

export const airdropShot = async () => {
    const user = new User()
    await user.getOrCreateShotTokenBag();


    await mintTo(
        connection,
        await randomPayer(),
        shotMintKeypair.publicKey,
        user.shotTokenBag,
        shotMintKeypair, // a pubkey is not enough, otherwise anyone would be printing tokens!
        1_000_000_000,
        []
    );

    const balance = await (new TokenHelper(shotMintKeypair.publicKey)).balance(user.shotTokenBag);
    console.log(`🔫 Token Account 💰'${user.shotTokenBag.toString()}' balance: ${balance}`);
}