import { RefreshToken, User, Device } from "@prisma/client";

type HandleRefreshTokenReuseProps = {
    reusedToken: RefreshToken;
    user: User;
    device: Device;
    ipAddress: string;
}
export const handleRefreshTokenReuse = async (props: HandleRefreshTokenReuseProps): Promise<> => {


}
