import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AuthService } from "./AuthModule/auth.service";
import { Command } from "commander";

async function bootstrap() {
    const appContext = await NestFactory.createApplicationContext(AppModule);
    const authService = appContext.get(AuthService);

    const program: Command = new Command();

    program
        .command('listPending')
        .description('List all pending admissions')
        .action(async () => {
            const apps = await authService.listAllPendingAdmissions();
            console.table(apps);
            await appContext.close();
        });

    program
        .command('listAll')
        .description('List all admissions')
        .action(async () => {
            const apps = await authService.listAllAdmissions();
            console.table(apps);
            await appContext.close();
        });

    program
        .command('accept <userId>')
        .description('Accept an user admission')
        .action(async (userId: string) => {
            await authService.acceptUser(userId);
            console.log(`User ${userId} accepted`);
            await appContext.close();
        });

    program
        .command('reject <userId>')
        .description('reject an user admission')
        .action(async (userId: string) => {
            await authService.rejectUser(userId);
            console.log(`User ${userId} rejected`);
            await appContext.close();
        });

    await program.parseAsync(process.argv);
}

bootstrap();