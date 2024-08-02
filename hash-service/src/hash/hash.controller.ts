import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HashService } from './hash.service';
import { CreateHashDto } from './dto/create-hash.dto';
import { UpdateHashDto } from './dto/update-hash.dto';

@Controller('hash')
export class HashController {
  constructor(private readonly hashService: HashService) {}

  @Get()
  async generateHash(): Promise<{ hash: string }> {
    const hash = await this.hashService.generateHash();
    return { hash };
  }
}
