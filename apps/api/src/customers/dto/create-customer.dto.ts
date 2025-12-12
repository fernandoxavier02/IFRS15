import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer name', example: 'Acme Corporation' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Customer email', example: 'contact@acme.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Tax ID / CNPJ / CPF', example: '12.345.678/0001-90', required: false })
  @IsString()
  @IsOptional()
  taxId?: string;

  @ApiProperty({ 
    description: 'Customer address', 
    example: { 
      street: '123 Main St', 
      city: 'São Paulo', 
      state: 'SP', 
      zipCode: '01234-567',
      country: 'Brazil' 
    },
    required: false 
  })
  @IsObject()
  @IsOptional()
  address?: object;

  @ApiProperty({ description: 'Is customer active', example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
