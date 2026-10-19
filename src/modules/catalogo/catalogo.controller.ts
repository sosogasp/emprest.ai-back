import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards, UseInterceptors } from '@nestjs/common'
import { ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiOperation } from '@nestjs/swagger'
import { AcessoGuard, ContextoInterceptor } from '../acesso/acesso.guard'
import { CatalogoService } from './catalogo.service'
import { CriarEquipamentoDto, EmprestimoDto, EmprestimosDto, EquipamentoDto, EquipamentosDto, PaginaQuery, PerfilDto, SolicitarDto } from './dtos'

@ApiBearerAuth()
@UseGuards(AcessoGuard)
@UseInterceptors(ContextoInterceptor)
@Controller()
export class CatalogoController {
  constructor(private readonly service: CatalogoService) {}

  @Get('me')
  @ApiOperation({ operationId: 'getPerfil' })
  @ApiOkResponse({ type: PerfilDto })
  perfil() { return this.service.perfil() }

  @Get('equipamentos')
  @ApiOperation({ operationId: 'getEquipamentos' })
  @ApiOkResponse({ type: EquipamentosDto })
  equipamentos(@Query() query: PaginaQuery) { return this.service.equipamentos(query.cursor) }

  @Get('emprestimos')
  @ApiOperation({ operationId: 'getEmprestimos' })
  @ApiOkResponse({ type: EmprestimosDto })
  emprestimos(@Query() query: PaginaQuery) { return this.service.emprestimos(query.cursor) }

  @Post('equipamentos')
  @ApiOperation({ operationId: 'postEquipamento' })
  @ApiCreatedResponse({ type: EquipamentoDto })
  cadastrar(@Body() dto: CriarEquipamentoDto) { return this.service.cadastrar(dto) }

  @Post('emprestimos')
  @ApiOperation({ operationId: 'postEmprestimo' })
  @ApiCreatedResponse({ type: EmprestimoDto })
  solicitar(@Body() dto: SolicitarDto) { return this.service.solicitar(dto.equipamentoId) }

  @Post('emprestimos/:id/devolucao')
  @ApiOperation({ operationId: 'postDevolucao' })
  @ApiCreatedResponse({ type: EmprestimoDto })
  devolver(@Param('id', ParseUUIDPipe) id: string) { return this.service.devolver(id) }
}
