import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Hash {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  hash: string;
}