import { mintTo, transferChecked }  from "@solana/spl-token";
import { shotMintKeypair, connection, randomPayer, userKeypair } from "./config";
import { TokenHelper } from "./utils/token-helper";
import { User } from "./utils/user";

export const airdropShot = async () => {
    const user = new User()
    await user.getOrCreateShotTokenBag();


    await mintTo(
        connection,
        userKeypair,
        shotMintKeypair.publicKey,
        user.shotTokenBag,
        shotMintKeypair, // a pubkey is not enough, otherwise anyone would be printing tokens!
        1_000_000_000,
        []
    );

    await transferChecked(
        connection,
        userKeypair,
        userKeypair.publicKey,
        await randomPayer(),
        user.shotTokenBag,
        shotMintKeypair, 
        1_000_000,
        []
    );

    const balance = await (new TokenHelper(shotMintKeypair.publicKey)).balance(user.shotTokenBag);
    console.log(`🔫 Token Account 💰'${user.shotTokenBag.toString()}' balance: ${balance}`);
}