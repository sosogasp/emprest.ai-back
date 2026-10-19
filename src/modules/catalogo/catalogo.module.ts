import { Module } from '@nestjs/common'
import { PrismaModule } from '../../prisma/prisma.module'
import { AcessoGuard, ContextoInterceptor } from '../acesso/acesso.guard'
import { AcessoRepository } from '../acesso/acesso.repository'
import { Contexto } from '../acesso/contexto'
import { Token } from '../acesso/token'
import { CatalogoController } from './catalogo.controller'
import { CatalogoRepository } from './catalogo.repository'
import { CatalogoService } from './catalogo.service'

@Module({ imports: [PrismaModule], controllers: [CatalogoController], providers: [CatalogoService, CatalogoRepository, Contexto, Token, AcessoGuard, AcessoRepository, ContextoInterceptor] })
export class CatalogoModule {}
