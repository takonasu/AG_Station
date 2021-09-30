import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';

@Entity()
export class Record extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string;

    @Column()
    public program_name: string;

    @Column({ type: 'datetime' })
    public start_time: Date;

    @Column()
    public program_length: number;

    @Column()
    public recorded: boolean;
}

export default Record;
